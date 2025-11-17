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

export interface DbProject {
  id: string;
  user_id: string;
  name: string;
  storage_path: string;
}

export async function createProject(data: {
  name: string;
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
    })
    .select()
    .single();

  if (error) throw error;
  return project as DbProject;
}

export async function getProjects() {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', user.id)
    .order('name', { ascending: true });

  if (error) throw error;
  return data as DbProject[];
}

export async function getProject(id: string) {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error) throw error;
  return data as DbProject;
}

export async function deleteProject(id: string) {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error('User not authenticated');

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

  // Upload file to storage using project's storage_path
  const { error: uploadError } = await supabase.storage
    .from('project-files')
    .upload(filePath, file, {
      upsert: true,
    });

  if (uploadError) throw uploadError;

  // Create file metadata record
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
  status: 'pending' | 'in_progress' | 'solved' | 'failed';
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
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('issues')
    .select('*')
    .eq('project_id', projectId)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as DbIssue[];
}

export async function getIssue(id: string) {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('issues')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error) throw error;
  return data as DbIssue;
}

export async function updateIssue(
  id: string,
  updates: Partial<DbIssue>
) {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('issues')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data as DbIssue;
}

export async function deleteIssue(id: string) {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error('User not authenticated');

  const { error } = await supabase
    .from('issues')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) throw error;
}
