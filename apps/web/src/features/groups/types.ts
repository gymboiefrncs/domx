import type { GroupDetail, NewMember } from "@domx/shared";

export type GroupContextType = {
  groups: GroupDetail[];
  loading: boolean;
  addGroup: (data: GroupDetail) => void;
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
  onSuccess: (newMember: NewMember) => void;
};

export type GroupCardProps = {
  group: GroupDetail;
  onClick: (groupId: string) => void;
};
