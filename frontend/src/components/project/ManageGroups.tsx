import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Users, Plus, UserPlus, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getGroups, createGroupInvite, joinGroup, DbGroup } from "@/lib/database";
import { CreateGroup } from "./CreateGroup";

interface ManageGroupsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectGroup?: (groupId: string | null) => void; // null = all, "personal" = personal only, uuid = specific group
  onGroupUpdate?: () => void;
}

export function ManageGroups({ open, onOpenChange, onSelectGroup, onGroupUpdate }: ManageGroupsProps) {
  const [groups, setGroups] = useState<DbGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [joinGroupOpen, setJoinGroupOpen] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const userGroups = await getGroups();
      setGroups(userGroups);
    } catch (error) {
      console.error("Failed to fetch groups:", error);
      toast.error("Failed to fetch groups");
    } finally {
      setLoading(false);
    }
  };

  const handleGroupUpdated = () => {
    fetchGroups();
    onGroupUpdate?.();
  }

  useEffect(() => {
    if (open) {
      fetchGroups();
    }
  }, [open]);

  const handleSelect = (groupId: string | null) => {
    if (onSelectGroup) {
      onSelectGroup(groupId);
    }
  };

  const handleInvite = async (e: React.MouseEvent, groupId: string) => {
    e.stopPropagation();
    try {
      const invite = await createGroupInvite(groupId);
      await navigator.clipboard.writeText(invite.code);
      toast.success("Invite code copied!", {
        description: `Code: ${invite.code}`,
        action: {
            label: "Copy Again",
            onClick: () => navigator.clipboard.writeText(invite.code),
        }
      });
    } catch (error) {
      console.error("Failed to create invite:", error);
      toast.error("Failed to create invite");
    }
  };

  const handleJoinGroup = async () => {
    if (!joinCode.trim()) return;
    
    setJoining(true);
    try {
      await joinGroup(joinCode.trim());
      toast.success("Successfully joined group!");
      setJoinGroupOpen(false);
      setJoinCode("");
      handleGroupUpdated(); // Refresh list and parent
    } catch (error) {
      console.error("Failed to join group:", error);
      toast.error(error instanceof Error ? error.message : "Failed to join group");
    } finally {
      setJoining(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Groups</DialogTitle>
            <DialogDescription>
              Select a group to view its projects, create a new one, or join an existing one.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex gap-2 mt-4">
            <Button onClick={() => setCreateGroupOpen(true)} className="flex-1">
              <Plus className="h-4 w-4 mr-2" />
              Create Group
            </Button>
            <Button variant="outline" onClick={() => setJoinGroupOpen(true)} className="flex-1">
              <LinkIcon className="h-4 w-4 mr-2" />
              Join Group
            </Button>
          </div>

          <ScrollArea className="h-[300px] mt-4 border rounded-md p-2">
            {loading ? (
              <p className="text-sm text-muted-foreground text-center py-4">Loading groups...</p>
            ) : (
              <div className="space-y-1">
                 {/* All Projects Option */}
                 <div 
                    className="flex items-center p-2 rounded-md hover:bg-accent cursor-pointer"
                    onClick={() => handleSelect(null)}
                  >
                    <Users className="h-5 w-5 mr-3 text-muted-foreground" />
                    <span className="text-sm font-medium flex-1">All Projects</span>
                  </div>

                  {/* Personal Projects Option */}
                  <div 
                    className="flex items-center p-2 rounded-md hover:bg-accent cursor-pointer"
                    onClick={() => handleSelect("personal")}
                  >
                    <Users className="h-5 w-5 mr-3 text-muted-foreground" />
                    <span className="text-sm font-medium flex-1">Personal Projects</span>
                  </div>

                  <div className="my-2 border-t"></div>

                {groups.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    You are not a member of any groups yet.
                  </p>
                ) : (
                  groups.map((group) => (
                    <div 
                      key={group.id} 
                      className="group flex items-center p-2 rounded-md hover:bg-accent cursor-pointer justify-between"
                      onClick={() => handleSelect(group.id)}
                    >
                      <div className="flex items-center">
                        <Users className="h-5 w-5 mr-3 text-muted-foreground" />
                        <span className="text-sm font-medium">{group.name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => handleInvite(e, group.id)}
                        title="Copy Invite Link"
                      >
                        <UserPlus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <CreateGroup
        open={createGroupOpen}
        onOpenChange={setCreateGroupOpen}
        onGroupCreated={handleGroupUpdated}
      />

      <Dialog open={joinGroupOpen} onOpenChange={setJoinGroupOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Join Group</DialogTitle>
            <DialogDescription>
              Enter the invite code to join a group.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <Input
              placeholder="Enter invite code..."
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
            />
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setJoinGroupOpen(false)}>Cancel</Button>
            <Button onClick={handleJoinGroup} disabled={!joinCode.trim() || joining}>
              {joining ? "Joining..." : "Join Group"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
