import type { Group, Member } from "@domx/shared";

export type GroupContextType = {
  groups: Group[];
  loading: boolean;
  addGroup: (data: Group) => void;
  renameGroupInList: (groupId: string, newName: string) => void;
  deleteGroupInList: (groupId: string) => void;
  incrementMemberCount: (groupId: string) => void;
  decrementMemberCount: (groupId: string) => void;
  clearUnreadCount: (groupId: string) => void;
};

export type CreateGroupModalProps = {
  onClose: () => void;
};

export type AddMemberProps = {
  onClose: () => void;
  onSuccess: (newMember: Member) => void;
};

export type GroupCardProps = {
  group: Group;
  onClick: (groupId: string) => void;
};
