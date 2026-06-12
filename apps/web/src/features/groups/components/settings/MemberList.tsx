import { useSuspenseQuery } from "@tanstack/react-query";
import { groupMembersQueryOptions } from "../../queries";
import type { GroupRole } from "@domx/shared";
import { MemberListItem } from "./MemberListItem";

export const MemberList = ({
  groupId,
  myRole,
}: {
  groupId: string;
  myRole: GroupRole;
}) => {
  const { data } = useSuspenseQuery({
    ...groupMembersQueryOptions(groupId),
    select: (members) => ({
      admins: members.filter((m) => m.role === "admin"),
      regularMembers: members.filter((m) => m.role === "member"),
    }),
  });
  const { admins, regularMembers } = data;
  return (
    <div className="overflow-y-auto py-2">
      {admins.length > 0 && (
        <div className="px-5">
          <p className="text-sm font-medium text-foreground mb-2">Chat Info</p>
          <p className="text-xs font-bold text-muted-foreground mb-2">Admins</p>
          <ul className="divide-y divide-muted rounded-md border">
            {admins.map((admin) => (
              <MemberListItem
                key={admin.display_id}
                displayId={admin.display_id}
                myRole={myRole}
                groupId={groupId}
                username={admin.username}
                groupRole={admin.role}
              />
            ))}
          </ul>
        </div>
      )}
      {regularMembers.length > 0 && (
        <div className="px-5 mt-6">
          <p className="text-xs font-bold text-muted-foreground mb-2">
            Members
          </p>
          <ul className="divide-y divide-muted rounded-md border">
            {regularMembers.map((member) => (
              <MemberListItem
                key={member.display_id}
                displayId={member.display_id}
                myRole={myRole}
                groupId={groupId}
                username={member.username}
                groupRole={member.role}
              />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
