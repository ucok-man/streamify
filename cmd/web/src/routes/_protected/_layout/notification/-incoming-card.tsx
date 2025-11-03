import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { apiclient } from "../../../../lib/apiclient";
import { refetchQuery } from "../../../../lib/query-client";
import type { FriendRequestWithSenderResponse } from "../../../../types/friend-request-with-sender-response.type";

type Props = {
  item: FriendRequestWithSenderResponse;
};

export default function IncomingCard({ item }: Props) {
  const acceptFriend = useMutation({
    mutationFn: async (reqId: string) => {
      const { data } = await apiclient.post(
        `/users/friends-request/accept/${reqId}`
      );
      return data;
    },

    onSuccess: () => {
      toast.success(`You are now friend with ${item.sender.full_name}`);
      refetchQuery(["incoming:friend:request"]);
    },
  });

  return (
    <div className="card bg-base-200 shadow-sm transition-shadow hover:shadow-md">
      <div className="card-body p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="avatar h-14 w-14 rounded-full bg-base-300">
              <img src={item.sender.profile_pic} alt={item.sender.full_name} />
            </div>
            <div>
              <h3 className="font-semibold">{item.sender.full_name}</h3>
              <div className="mt-1 flex flex-wrap gap-1.5">
                <span className="badge badge-sm badge-secondary">
                  Native: {item.sender.native_lng}
                </span>
                <span className="badge badge-outline badge-sm">
                  Learning: {item.sender.learning_lng}
                </span>
              </div>
            </div>
          </div>

          <button
            className="btn btn-sm btn-primary"
            onClick={() => acceptFriend.mutate(item.id)}
            disabled={acceptFriend.isPending}
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
