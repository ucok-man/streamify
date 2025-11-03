import {
  CallControls,
  CallingState,
  SpeakerLayout,
  StreamCall,
  StreamTheme,
  StreamVideo,
  StreamVideoClient,
  useCallStateHooks,
} from "@stream-io/video-react-sdk";
import "@stream-io/video-react-sdk/dist/css/styles.css";
import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { apiclient } from "../../../../lib/apiclient";

export const Route = createFileRoute("/_protected/call/$channelId")({
  loader: async ({ params, context }) => {
    const { data: user } = context.session;
    if (!user) throw notFound();

    const token = await apiclient
      .get<{ token: string }>(`/chat/token`)
      .then((res) => res.data.token)
      .catch((error) => {
        throw error;
      });

    const streamclient = new StreamVideoClient({
      apiKey: import.meta.env.VITE_GETSTREAMIO_API_KEY,
      user: {
        id: user.id,
        name: user.full_name,
        image: user.profile_pic,
      },
      token: token,
    });

    const callInstance = streamclient.call("default", params.channelId);
    await callInstance.join({ create: true });
    return {
      streamclient,
      callInstance,
    };
  },
  component: CallPage,
});

function CallPage() {
  const { callInstance, streamclient } = Route.useLoaderData();
  return (
    <div className="flex h-screen flex-col items-center justify-center">
      <div className="relative">
        <StreamVideo client={streamclient}>
          <StreamCall call={callInstance}>
            <CallContent />
          </StreamCall>
        </StreamVideo>
      </div>
    </div>
  );
}

const CallContent = () => {
  const { useCallCallingState } = useCallStateHooks();
  const state = useCallCallingState();
  const navigate = useNavigate();

  useEffect(() => {
    if (state === CallingState.LEFT) {
      navigate({
        to: "/",
        search: {
          query: undefined,
        },
      });
    }
  }, [state, navigate]);

  return (
    <StreamTheme>
      <SpeakerLayout />
      <CallControls />
    </StreamTheme>
  );
};
