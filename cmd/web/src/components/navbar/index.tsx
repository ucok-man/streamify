/* eslint-disable tailwindcss/no-custom-classname */
import { useMutation } from "@tanstack/react-query";
import {
  Link,
  useLocation,
  useNavigate,
  useRouteContext,
} from "@tanstack/react-router";
import { BellIcon, LogOutIcon, ShipWheelIcon, UsersIcon } from "lucide-react";
import { useTransition } from "react";
import toast from "react-hot-toast";
import { apiclient } from "../../lib/apiclient";
import { refetchQuery } from "../../lib/query-client";

const Navbar = () => {
  const [isRedirecting, startTransition] = useTransition();
  const navigate = useNavigate();
  const { session } = useRouteContext({
    from: "/_protected",
  });
  const location = useLocation();
  const isChatPage = location.pathname?.startsWith("/chat");

  const user = session.data;

  const signout = useMutation({
    mutationFn: async () => {
      const { data } = await apiclient.post<{ message: string }>(
        "/auth/signout"
      );
      return data;
    },
    onSuccess: () => {
      refetchQuery(["auth:session"]);
      startTransition(() => {
        navigate({
          to: "/signin",
          reloadDocument: true,
        });
      });
    },
    onError: () => {
      toast.error(
        "Sorry our server encountered problem. Please try again later!"
      );
    },
  });

  return (
    <nav className="sticky top-0 z-30 flex h-20 items-center border-b border-base-300 bg-base-200">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex w-full items-center justify-end">
          {isChatPage && (
            <div className="pl-5">
              <Link
                to="/"
                search={{ query: undefined }}
                className="flex items-center gap-2.5"
              >
                <ShipWheelIcon className="size-9 text-primary" />
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text font-mono text-3xl font-bold tracking-wider text-transparent">
                  Streamify
                </span>
              </Link>
            </div>
          )}

          <div className="ml-auto flex items-center gap-2 sm:gap-4">
            <Link to={"/notification"}>
              <button className="btn btn-circle btn-ghost">
                <BellIcon className="h-6 w-6 text-base-content opacity-70" />
              </button>
            </Link>

            {/* Avatar Dropdown */}
            <div className="dropdown dropdown-end">
              <div
                tabIndex={0}
                role="button"
                className="btn avatar btn-circle btn-ghost"
              >
                <div className="w-9 rounded-full ring ring-primary ring-offset-2 ring-offset-base-100">
                  <img
                    src={user?.profile_pic}
                    alt="User Avatar"
                    rel="noreferrer"
                  />
                </div>
              </div>
              <div
                tabIndex={0}
                className="dropdown-content z-[1] mt-3 w-64 rounded-xl bg-base-100 p-4 shadow-xl"
              >
                <div className="mb-4 flex items-center gap-3 border-b pb-4">
                  <div className="h-12 w-12 overflow-hidden rounded-full">
                    <img
                      src={user?.profile_pic}
                      alt="Profile"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="font-semibold text-base-content">
                      {user?.full_name}
                    </div>
                    <div className="text-sm text-base-content/60">
                      {user?.email}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Link
                    to="/"
                    search={{ query: undefined }}
                    className="btn w-full justify-start gap-3 px-3 text-left normal-case btn-ghost"
                    activeProps={{
                      className: "btn-active bg-secondary text-accent-content",
                    }}
                  >
                    <ShipWheelIcon className="size-5 opacity-70" />
                    <span className="text-sm">Home</span>
                  </Link>

                  <Link
                    to="/friend"
                    search={{
                      query: undefined,
                    }}
                    className="btn w-full justify-start gap-3 px-3 text-left normal-case btn-ghost"
                    activeProps={{
                      className: "btn-active bg-secondary text-accent-content",
                    }}
                  >
                    <UsersIcon className="size-5 opacity-70" />
                    <span className="text-sm">Friends</span>
                  </Link>

                  <Link
                    to="/notification"
                    className="btn w-full justify-start gap-3 px-3 text-left normal-case btn-ghost"
                    activeProps={{
                      className: "btn-active bg-secondary text-accent-content",
                    }}
                  >
                    <BellIcon className="size-5 opacity-70" />
                    <span className="text-sm">Notifications</span>
                  </Link>
                </div>

                <button
                  disabled={signout.isPending || isRedirecting}
                  onClick={() => signout.mutate()}
                  className="btn my-2 w-full justify-start gap-1 px-3 text-left normal-case btn-error"
                >
                  <LogOutIcon className="mr-2 h-5 w-5" />
                  <span className="text-sm">Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
