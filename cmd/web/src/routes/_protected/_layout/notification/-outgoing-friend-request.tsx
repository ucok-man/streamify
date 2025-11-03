import { useInfiniteQuery } from "@tanstack/react-query";
import { BellIcon } from "lucide-react";
import { useEffect, useMemo, type PropsWithChildren } from "react";
import toast from "react-hot-toast";
import { useIntersectionObserver } from "usehooks-ts";
import { apiclient } from "../../../../lib/apiclient";
import type { FriendRequestWithRecipientResponse } from "../../../../types/friend-request-with-recipient-response.type";
import type { MetadataResponse } from "../../../../types/metadata-response.type";
import OutgoingCard from "./-outgoing-card";

export default function OutgoingFriendRequest() {
  const {
    data,
    isPending,
    error,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: ["outgoing:friend:request"],
    queryFn: async ({ pageParam }) => {
      const { data } = await apiclient.get(
        `/users/friends-request/send?status=Pending&page_size=6&page=${pageParam}`
      );
      return data as {
        friend_requests: FriendRequestWithRecipientResponse[];
        metadata: MetadataResponse;
      };
    },
    initialPageParam: 1,
    getNextPageParam: (last) => {
      return last.metadata.current_page < last.metadata.last_page
        ? last.metadata.current_page + 1
        : undefined;
    },
  });

  const observer = useIntersectionObserver({
    threshold: 0,
    rootMargin: "100px",
  });

  useEffect(() => {
    if (observer.isIntersecting && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [observer.isIntersecting, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const requests = useMemo(
    () => data?.pages.flatMap((page) => page.friend_requests) ?? [],
    [data?.pages]
  );

  if (isPending) {
    return (
      <Wrapper>
        <div className="flex h-[280px] w-full items-center justify-center">
          <span className="loading loading-lg loading-spinner" />
        </div>
      </Wrapper>
    );
  }

  if (error) {
    toast.error("Sorry we have problem in our server. Please try again later!");
    return (
      <Wrapper>
        <div className="flex h-[280px] w-full items-center justify-center">
          <span className="loading loading-lg loading-spinner" />
        </div>
      </Wrapper>
    );
  }

  if (requests.length === 0) {
    return (
      <Wrapper>
        <div className="card flex h-[280px] w-full items-center justify-center bg-base-200 p-5 text-center">
          <h3 className="mb-2 text-lg font-semibold">
            No outgoing friends request yet
          </h3>
          <p className="text-base-content opacity-70">
            You don't have any outgoing request available!
          </p>
        </div>
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <div className="absolute top-0 left-[272px]">
        <div className="badge badge-warning">
          {data.pages[0]?.metadata.total_records}
        </div>
      </div>

      <div className="relative">
        <div className="grid gap-x-4 gap-y-2 md:grid-cols-2">
          {requests.map((request, idx) => (
            <OutgoingCard key={idx} item={request} />
          ))}
        </div>
        {/* Marker */}
        {hasNextPage && (
          <div
            ref={observer.ref}
            id="marker"
            className="pointer-events-none absolute bottom-0 -z-50"
          />
        )}
      </div>
    </Wrapper>
  );
}

function Wrapper({ children }: PropsWithChildren) {
  return (
    <section className="relative space-y-4">
      <h2 className="flex items-center gap-2 text-xl font-semibold">
        <BellIcon className="h-5 w-5 text-primary" />
        Outgoing Friend Requests
      </h2>

      <div className="max-h-[280px] overflow-y-scroll">{children}</div>
    </section>
  );
}
