import { Link } from "@tanstack/react-router";
import { MapPinIcon } from "lucide-react";
import { capitialize } from "../../lib/utils";
import type { UserResponse } from "../../types/user-response.type";
import LanguageFlag from "../language-flag";

type Props = {
  friend: UserResponse;
};

export default function FriendCard({ friend }: Props) {
  return (
    <div className="card bg-base-200 transition-all duration-300 hover:shadow-lg">
      <div className="card-body space-y-4 p-5">
        <div className="flex items-center gap-3">
          <div className="avatar size-16 rounded-full">
            <img src={friend.profile_pic} alt={friend.full_name} />
          </div>

          <div>
            <h3 className="text-lg font-semibold">{friend.full_name}</h3>
            {friend.location && (
              <div className="mt-1 flex items-center text-xs opacity-70">
                <MapPinIcon className="mr-1 size-3" />
                {friend.location}
              </div>
            )}
          </div>
        </div>
        {/* Languages with flags */}
        <div className="flex flex-wrap gap-1.5 space-y-1">
          <span className="badge badge-secondary">
            <LanguageFlag language={friend.native_lng} />
            Native: {capitialize(friend.native_lng)}
          </span>
          <span className="badge badge-outline">
            <LanguageFlag language={friend.learning_lng} />
            Learning: {capitialize(friend.learning_lng)}
          </span>
        </div>
        <p className="line-clamp-2 text-sm opacity-70">{friend.bio}</p>
        {/* Action button */}
        <Link
          to={`/chat/$friendId`}
          params={{
            friendId: friend.id,
          }}
          className="btn w-full btn-outline hover:border-accent"
        >
          Message
        </Link>
      </div>
    </div>
  );
}
