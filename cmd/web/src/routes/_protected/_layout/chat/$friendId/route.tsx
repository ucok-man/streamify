import { createFileRoute, notFound } from "@tanstack/react-router";
import { AxiosError } from "axios";
import { VideoIcon } from "lucide-react";
import { useEffect } from "react";
import { StreamChat } from "stream-chat";
import {
  Channel,
  ChannelHeader,
  Chat,
  MessageInput,
  MessageList,
  Thread,
  Window,
} from "stream-chat-react";
import "stream-chat-react/css/v2/index.css";
import NotFound from "../../../../../components/not-found";
import { apiclient } from "../../../../../lib/apiclient";
import type { UserResponse } from "../../../../../types/user-response.type";

export const Route = createFileRoute("/_protected/_layout/chat/$friendId")({
  loader: async ({ params, context }) => {
    const friend = await apiclient
      .get<{ user: UserResponse }>(`/users/${params.friendId}`)
      .then((res) => res.data.user)
      .catch((error) => {
        if (
          error instanceof AxiosError &&
          (error.response?.status === 404 || error.response?.status === 400)
        )
          return null;
        throw error;
      });

    if (!friend) throw notFound();

    const token = await apiclient
      .get<{ token: string }>(`/chat/token`)
      .then((res) => res.data.token)
      .catch((error) => {
        throw error;
      });

    const streamclient = StreamChat.getInstance(
      import.meta.env.VITE_GETSTREAMIO_API_KEY
    );

    const { data: user } = context.session;
    if (!user) throw notFound();

    await streamclient.connectUser(
      {
        id: user!.id,
        name: user!.full_name,
        image: user!.profile_pic,
      },
      token
    );

    const chanId = [user.id, friend.id].sort().join("-");
    const channel = streamclient.channel("messaging", chanId, {
      members: [user.id, friend.id],
    });

    return { token, channel, streamclient };
  },
  component: ChatPage,
  notFoundComponent: NotFound,
});

function ChatPage() {
  const { channel, streamclient } = Route.useLoaderData();
  useEffect(() => {
    channel.watch();
  }, [channel, streamclient]);

  return (
    <div className="h-[90vh]">
      <Chat client={streamclient}>
        <Channel channel={channel}>
          <div className="relative w-full">
            {/* Call Btn */}
            <div className="absolute top-0 mx-auto flex w-full max-w-7xl items-center justify-end border-b p-3">
              <button
                onClick={() => {
                  const callUrl = `${window.location.origin}/call/${channel.id}`;
                  channel.sendMessage({
                    text: `I've started a video call. Join me here: ${callUrl}`,
                  });
                }}
                className="btn text-white btn-sm btn-success"
              >
                <VideoIcon className="size-6" />
              </button>
            </div>

            {/* Chat Window */}
            <Window>
              <ChannelHeader />
              <MessageList />
              <MessageInput focus />
            </Window>
          </div>
          <Thread />
        </Channel>
      </Chat>
    </div>
  );
}
