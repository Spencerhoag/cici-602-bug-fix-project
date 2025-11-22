import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Users, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getGroups, DbGroup } from "@/lib/database";
import { CreateGroup } from "./CreateGroup";

interface ManageGroupsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ManageGroups({ open, onOpenChange }: ManageGroupsProps) {
  const [groups, setGroups] = useState<DbGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [createGroupOpen, setCreateGroupOpen] = useState(false);

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

  useEffect(() => {
    if (open) {
      fetchGroups();
    }
  }, [open]);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Groups</DialogTitle>
            <DialogDescription>
              View your groups or create a new one.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <Button onClick={() => setCreateGroupOpen(true)} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Create New Group
            </Button>
          </div>
          <ScrollArea className="h-[300px] mt-4 border rounded-md p-2">
            {loading ? (
              <p className="text-sm text-muted-foreground text-center py-4">Loading groups...</p>
            ) : groups.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                You are not a member of any groups yet.
              </p>
            ) : (
              <div className="space-y-2">
                {groups.map((group) => (
                  <div key={group.id} className="flex items-center p-2 rounded-md hover:bg-accent">
                    <Users className="h-5 w-5 mr-3 text-muted-foreground" />
                    <span className="text-sm font-medium">{group.name}</span>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <CreateGroup
        open={createGroupOpen}
        onOpenChange={setCreateGroupOpen}
        onGroupCreated={fetchGroups} // Refresh the list when a new group is created
      />
    </>
  );
}
