import { supabase } from './supabase';

// ============================================
// USER MANAGEMENT
// ============================================

/**
 * Ensures a user record exists in the users table.
 * Creates one if it doesn't exist.
 */
async function ensureUserRecord() {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error('User not authenticated');

  console.log('[ensureUserRecord] Checking for user:', { id: user.id, email: user.email });

  // Check if user record exists by ID
  const { data: existingUser, error: selectError } = await supabase
    .from('users')
    .select('id, username')
    .eq('id', user.id)
    .maybeSingle();

  console.log('[ensureUserRecord] Query by ID result:', { existingUser, selectError });

  // If there's a real error (not just "not found"), throw it
  if (selectError) {
    console.error('[ensureUserRecord] Error querying user by ID:', selectError);
    throw selectError;
  }

  // If user doesn't exist, create or update it
  if (!existingUser) {
    console.log('[ensureUserRecord] User record not found, attempting to create...');

    // Check if a record exists with this username (email)
    if (user.email) {
      const { data: userByEmail } = await supabase
        .from('users')
        .select('id, username')
        .eq('username', user.email)
        .maybeSingle();

      console.log('[ensureUserRecord] Query by username result:', userByEmail);

      // If username exists with different ID, update the ID
      if (userByEmail && userByEmail.id !== user.id) {
        console.log('[ensureUserRecord] Username exists with different ID, updating...');
        const { error: updateError } = await supabase
          .from('users')
          .update({ id: user.id })
          .eq('username', user.email);

        if (updateError) {
          console.error('[ensureUserRecord] Failed to update user ID:', updateError);
          throw updateError;
        }
        console.log('[ensureUserRecord] User ID updated successfully');
        return;
      }
    }

    // Try to insert new user record
    const { error: insertError } = await supabase
      .from('users')
      .insert({
        id: user.id,
        username: user.email || user.id,
      });

    if (insertError) {
      console.error('[ensureUserRecord] Error creating user record:', insertError);
      console.error('[ensureUserRecord] Error details:', JSON.stringify(insertError, null, 2));

      // Ignore duplicate key errors (race condition - another request created it)
      if (insertError.code !== '23505') {
        throw insertError;
      } else {
        console.log('[ensureUserRecord] Duplicate key error - user was created by another request');
      }
    } else {
      console.log('[ensureUserRecord] User record created successfully');
    }
  } else {
    console.log('[ensureUserRecord] User record already exists');
  }
}

// ============================================
// PROJECTS
// ============================================

interface DbProject {
  id: string;
  name: string;
  description: string | null;
  repository: string | null;
  github_url: string | null;
  github_repo_name: string | null;
  group_id: string | null;
  user_id: string;
  storage_path: string;
  created_at: string;
}

export async function createProject(data: {
  name: string;
  githubUrl?: string;
  githubRepoName?: string;
  groupId?: string;
}) {
  // Ensure user record exists before creating project
  await ensureUserRecord();

  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error('User not authenticated');

  // Generate storage path: user_id/project_name
  const storagePath = `${user.id}/${data.name.toLowerCase().replace(/\s+/g, '-')}`;

  const { data: project, error } = await supabase
    .from('projects')
    .insert({
      user_id: user.id,
      name: data.name,
      storage_path: storagePath,
      github_url: data.githubUrl,
      github_repo_name: data.githubRepoName,
      group_id: data.groupId || null,
    })
    .select()
    .single();

  if (error) throw error;
  return project as DbProject;
}

export async function getProjects() {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error('User not authenticated');

  // Step 1: Get the list of group IDs the user is a member of
  const { data: userGroups, error: groupsError } = await supabase
    .from('user_groups')
    .select('group_id')
    .eq('user_id', user.id);

  if (groupsError) {
    console.error("Error fetching user groups:", groupsError);
    throw groupsError;
  }

  const groupIds = userGroups.map(g => g.group_id);

  // Step 2: Fetch projects using separate queries to ensure reliability
  
  // 2a. Fetch personal projects
  const personalQuery = supabase
    .from('projects')
    .select('*')
    .eq('user_id', user.id);

  // 2b. Fetch group projects (if any)
  let groupQuery;
  if (groupIds.length > 0) {
    groupQuery = supabase
      .from('projects')
      .select('*')
      .in('group_id', groupIds);
  }

  // Execute queries in parallel
  const [personalRes, groupRes] = await Promise.all([
    personalQuery,
    groupIds.length > 0 ? groupQuery : Promise.resolve({ data: [], error: null })
  ]);

  if (personalRes.error) throw personalRes.error;
  if (groupRes && groupRes.error) throw groupRes.error;

  // Merge results
  const personalProjects = personalRes.data || [];
  const groupProjects = groupRes?.data || [];
  
  // Create a map to deduplicate by ID (just in case, though sets should be disjoint)
  const projectMap = new Map();
  personalProjects.forEach(p => projectMap.set(p.id, p));
  groupProjects.forEach(p => projectMap.set(p.id, p));

  const allProjects = Array.from(projectMap.values());

  // Sort by name
  return allProjects.sort((a, b) => a.name.localeCompare(b.name)) as DbProject[];
}

export async function getProject(id: string) {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error('User not authenticated');

  // 1. Get the list of group IDs the user is a member of
  const { data: userGroups, error: groupsError } = await supabase
    .from('user_groups')
    .select('group_id')
    .eq('user_id', user.id);

  if (groupsError) throw groupsError;

  const groupIds = userGroups.map(g => g.group_id);

  // 2. Query project matching ID AND (owner OR group member)
  const query = supabase.from('projects').select('*').eq('id', id);

  if (groupIds.length > 0) {
    // If the user is in groups, fetch if they own it OR it's in their groups
    query.or(`user_id.eq.${user.id},group_id.in.(${groupIds.join(',')})`);
  } else {
    // If the user is in no groups, only fetch if they own it
    query.eq('user_id', user.id);
  }

  const { data, error } = await query.single();

  if (error) throw error;
  return data as DbProject;
}

export async function deleteProject(id: string) {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error('User not authenticated');

  // Get project to verify ownership
  await getProject(id);

  // Delete all files from storage
  const files = await getProjectFiles(id);
  if (files.length > 0) {
    const filePaths = files.map(f => f.path);
    await supabase.storage
      .from('project-files')
      .remove(filePaths);
  }

  // Delete all issues (and their metadata will cascade)
  await supabase
    .from('issues')
    .delete()
    .eq('project_id', id)
    .eq('user_id', user.id);

  // Delete all file metadata
  await supabase
    .from('project_files')
    .delete()
    .eq('project_id', id);

  // Delete the project itself
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) throw error;
}

// ============================================
// PROJECT FILES
// ============================================

export interface DbProjectFile {
  id: string;
  project_id: string;
  name: string;
  path: string;
  size?: number;
  mime_type?: string;
  created_at: string;
}

export async function uploadProjectFile(
  projectId: string,
  file: File,
  relativePath?: string // Optional relative path to preserve folder structure
): Promise<DbProjectFile> {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error('User not authenticated');

  // Get project to get storage_path
  const project = await getProject(projectId);

  // Determine the file path in storage
  let filePath: string;
  let fileName: string;

  if (relativePath) {
    // Use the relative path to preserve folder structure
    // Remove the root folder name if present (e.g., "my-repo/src/main.py" -> "src/main.py")
    const pathParts = relativePath.split('/');
    const filePathWithoutRoot = pathParts.length > 1 ? pathParts.slice(1).join('/') : relativePath;

    filePath = `${project.storage_path}/${filePathWithoutRoot}`;
    fileName = filePathWithoutRoot; // Store full relative path as name
  } else {
    // Simple file upload without folder structure
    filePath = `${project.storage_path}/${file.name}`;
    fileName = file.name;
  }

  // Check if file already exists in storage and delete it first
  // This avoids RLS issues with upsert
  const { data: existingFiles } = await supabase.storage
    .from('project-files')
    .list(project.storage_path);

  const fileExists = existingFiles?.some(f => {
    const fullPath = `${project.storage_path}/${f.name}`;
    return fullPath === filePath || f.name === fileName;
  });

  if (fileExists) {
    // Delete the old file first
    await supabase.storage
      .from('project-files')
      .remove([filePath]);
  }

  // Upload file to storage using project's storage_path
  const { error: uploadError } = await supabase.storage
    .from('project-files')
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  // Check if file metadata record already exists
  const { data: existingFile } = await supabase
    .from('project_files')
    .select('*')
    .eq('project_id', projectId)
    .eq('name', fileName)
    .maybeSingle();

  if (existingFile) {
    // Update existing record
    const { data, error } = await supabase
      .from('project_files')
      .update({
        path: filePath,
        size: file.size,
        mime_type: file.type,
      })
      .eq('project_id', projectId)
      .eq('name', fileName)
      .select()
      .single();

    if (error) throw error;
    return data as DbProjectFile;
  } else {
    // Create new file metadata record
    const { data, error } = await supabase
      .from('project_files')
      .insert({
        project_id: projectId,
        name: fileName,
        path: filePath,
        size: file.size,
        mime_type: file.type,
      })
      .select()
      .single();

    if (error) throw error;
    return data as DbProjectFile;
  }
}

export async function getProjectFiles(projectId: string) {
  // Verify user owns the project first
  await getProject(projectId);

  const { data, error } = await supabase
    .from('project_files')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data as DbProjectFile[];
}

export async function downloadProjectFile(path: string): Promise<Blob> {
  const { data, error } = await supabase.storage
    .from('project-files')
    .download(path);

  if (error) throw error;
  return data;
}

export async function getProjectFileContent(path: string): Promise<string> {
  const blob = await downloadProjectFile(path);
  return await blob.text();
}

export async function deleteProjectFile(id: string, path: string) {
  // First get the file to verify ownership through project
  const { data: fileData, error: fileError } = await supabase
    .from('project_files')
    .select('project_id')
    .eq('id', id)
    .single();

  if (fileError) throw fileError;

  // Verify user owns the project
  await getProject(fileData.project_id);

  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from('project-files')
    .remove([path]);

  if (storageError) throw storageError;

  // Delete metadata
  const { error } = await supabase.from('project_files').delete().eq('id', id);

  if (error) throw error;
}

// ============================================
// ISSUES
// ============================================

export interface DbIssue {
  id: string;
  project_id: string;
  user_id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'solved' | 'failed' | 'merged';
  mode: 'basic' | 'expected_output';
  expected_output?: string;
  selected_files?: string[];
  // Final result after all iterations
  original_code?: string;
  fixed_code?: string;
  reasoning?: string;
  runtime_output?: string;
  exit_code?: number;
  iterations_count: number;
  created_at: string;
  updated_at: string;
}

export async function createIssue(data: {
  project_id: string;
  title: string;
  description?: string;
  mode: 'basic' | 'expected_output';
  expected_output?: string;
  selected_files?: string[];
}) {
  // Ensure user record exists before creating issue
  await ensureUserRecord();

  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error('User not authenticated');

  const { data: issue, error } = await supabase
    .from('issues')
    .insert({
      user_id: user.id,
      project_id: data.project_id,
      title: data.title,
      description: data.description,
      mode: data.mode,
      expected_output: data.expected_output,
      selected_files: data.selected_files,
      status: 'pending',
      iterations_count: 0,
    })
    .select()
    .single();

  if (error) throw error;
  return issue as DbIssue;
}

export async function getIssues(projectId: string) {
  // Verify access to the project first (checks owner OR group member)
  await getProject(projectId);

  const { data, error } = await supabase
    .from('issues')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as DbIssue[];
}

export async function getIssue(id: string) {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error('User not authenticated');

  // 1. Fetch the issue without checking user_id yet
  const { data: issue, error } = await supabase
    .from('issues')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;

  // 2. Verify access to the project (Owner OR Group Member)
  try {
    await getProject(issue.project_id);
  } catch (e) {
    throw new Error('You do not have access to this issue');
  }

  return issue as DbIssue;
}

export async function updateIssue(
  id: string,
  updates: Partial<DbIssue>
) {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error('User not authenticated');

  // 1. Get issue to verify project access
  const { data: issue, error: fetchError } = await supabase
    .from('issues')
    .select('project_id')
    .eq('id', id)
    .single();
  
  if (fetchError) throw fetchError;

  // 2. Verify project access
  await getProject(issue.project_id);

  // 3. Update
  const { data, error } = await supabase
    .from('issues')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as DbIssue;
}

export async function deleteIssue(id: string) {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error('User not authenticated');

  // 1. Get issue to verify project access
  const { data: issue, error: fetchError } = await supabase
    .from('issues')
    .select('project_id')
    .eq('id', id)
    .single();
  
  if (fetchError) throw fetchError;

  // 2. Verify project access
  await getProject(issue.project_id);

  // 3. Delete
  const { error } = await supabase
    .from('issues')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ============================================
// GROUPS
// ============================================

export interface DbGroup {
  id: string;
  name: string;
  owner_id: string;
}

export async function getGroups() {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('user_groups')
    .select('groups(*)')
    .eq('user_id', user.id);

  if (error) throw error;
  
  if (!data) {
    return [];
  }

  // The result is an array of objects like [{ groups: { ... } }, { groups: null }]
  // We need to map to the 'groups' property and filter out any nulls.
  // Supabase join queries can return an array of single-item arrays, so we flatten the result.
  const groups = data.map(item => item.groups).filter(Boolean).flat();

  return groups as DbGroup[];
}

export async function createGroup(name: string) {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error('User not authenticated');

  // 1. Create the group
  const { data: group, error: createError } = await supabase
    .from('groups')
    .insert({
      name,
      owner_id: user.id,
    })
    .select()
    .single();

  if (createError) throw createError;

  // 2. Add the owner to the user_groups table as an admin
  const { error: linkError } = await supabase
    .from('user_groups')
    .insert({
      user_id: user.id,
      group_id: group.id,
      role: 'admin',
    });

  if (linkError) {
    // If linking fails, we should probably roll back the group creation.
    // For now, we'll just log the error and throw.
    console.error("Failed to link user to new group:", linkError);
    // Attempt to delete the orphaned group
    await supabase.from('groups').delete().eq('id', group.id);
    throw linkError;
  }

  return group as DbGroup;
}

// ============================================
// GROUP INVITES
// ============================================

export interface DbGroupInvite {
  id: string;
  group_id: string;
  code: string;
  created_by: string;
  created_at: string;
  expires_at?: string;
}

export async function createGroupInvite(groupId: string) {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error('User not authenticated');

  // Generate a simple unique code (using randomUUID if available, or fallback)
  const code = crypto.randomUUID();

  const { data, error } = await supabase
    .from('group_invites')
    .insert({
      group_id: groupId,
      code,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data as DbGroupInvite;
}

export async function joinGroup(inviteCode: string) {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error('User not authenticated');

  // 1. Find the invite
  const { data: invite, error: inviteError } = await supabase
    .from('group_invites')
    .select('group_id')
    .eq('code', inviteCode)
    .single();

  if (inviteError) throw new Error("Invalid or expired invite code");

  // 2. Check if user is already in the group
  const { data: existingMember } = await supabase
    .from('user_groups')
    .select('*')
    .eq('user_id', user.id)
    .eq('group_id', invite.group_id)
    .maybeSingle();

  if (existingMember) {
    throw new Error("You are already a member of this group");
  }

  // 3. Add user to the group
  const { error: joinError } = await supabase
    .from('user_groups')
    .insert({
      user_id: user.id,
      group_id: invite.group_id,
      role: 'member',
    });

  if (joinError) throw joinError;

  return invite.group_id;
}
