import React, { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import debounce from "lodash.debounce";
import { IoSearchSharp } from "react-icons/io5";
import { RiArrowDropDownLine } from "react-icons/ri";
import { BsFillSendPlusFill } from "react-icons/bs";


import {
  getIncommingRequest,
  getOutgoingRequest,
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
} from "../../api/friendRequestAPI";
import { searchUser } from "../../api/userAPI";
import toast from "react-hot-toast";

function ChatList() {
  const [ShowOutgoing, setShowOutgoing] = useState(false);
  const [query, setQuery] = useState(null);
  const queryClient = useQueryClient();
  const toggleOutgoing = () => {
    setShowOutgoing(!ShowOutgoing);
  };
  const handleSearchChange = (e) => {
    setQuery(e.target.value);
  };
  const handleAcceptRequest = (requestId) => {
    acceptFriendRequests(requestId);
  };
  const handleDeclineRequest = (requestId) => {
    declineFriendRequests(requestId);
  };
  const debouncedSearch = debounce(handleSearchChange, 300);
  const {
    data: searchResults,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["searchUser", query],
    queryFn: () => searchUser(query),
    enabled: !!query,
  });

  const { mutate: sendRequest, isPending: isSendingFriendRequest } =
    useMutation({
      mutationFn: sendFriendRequest,
      onSuccess: () => {
        queryClient.invalidateQueries("searchUser");
        toast.success("Sent Friend Request");
      },
      onError: (err) => {
        toast.error(err.message || "Something went wrong");
      },
    });
  const { data: outgoingRequests, isLoading: isLoadingOutgoingRequests } =
    useQuery({
      queryKey: ["outgoingRequests"],
      queryFn: () => getOutgoingRequest(),
      enabled: ShowOutgoing,
    });
  const { data: IncommingRequests, isLoading: isLoadingIncommingRequests } =
    useQuery({
      queryKey: ["IncommingRequests"],
      queryFn: () => getIncommingRequest(),
    });
  const { mutate: acceptFriendRequests, isPending: isAccepting } = useMutation({
    mutationFn: acceptFriendRequest,
    onSuccess: (data) => {
      toast.success("See them in chat now");
      queryClient.invalidateQueries("outgoingRequests");
    },
    onError: (err) => {
      toast.error(err.message || "Something went wrong");
    },
  });
  const { mutate: declineFriendRequests, isPending: isDeclining } = useMutation(
    {
      mutationFn: declineFriendRequest,
      onSuccess: (data) => {
        toast.error("You rejected the request");
        queryClient.invalidateQueries("outgoingRequests");
      },
      onError: (err) => {
        toast.error(err.message || "Something went wrong");
      },
    }
  );
  return (
    <div className="w-full 5 px-6 bg-background text-white">
      <div className="mb-6">
        <div className="flex justify-center items-center mt-4 ">
          <input
            type="text"
            placeholder="Search..."
            className="w-full px-4 py-2 rounded-xl bg-foreground placeholder-gray-400 shadow-sm focus:outline-none"
            onChange={(e) => debouncedSearch(e)}
          />
        </div>
        {isLoading && <p>Loading...</p>}
        {isError && <p>Error: {error.message}</p>}
        {searchResults && searchResults.length > 0 ? (
          <ul className="absolute  bg-foreground p-1 rounded-md flex-row gap-2">
            {searchResults.map((user) => (
              <li
                key={user._id}
                className="bg-gray-700 flex justify-between gap-2 my-2 p-2 group"
              >
                <div className="flex gap-2">
                  <img
                    className="w-12 h-12 object-cover"
                    src={
                      user.profileImg
                        ? user.profileImg
                        : "/avatar-placeholder.png"
                    }
                    alt="Profile Pic"
                  />

                  <div>
                    <p>{user.username}</p>
                    {user.bio && <p>{user.bio}</p>}
                  </div>
                </div>

                <button
                  onClick={() => sendRequest(user._id)}
                  className="bg-green-500 text-white p-2 rounded mr-2  opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  {isSendingFriendRequest ? "..." :<BsFillSendPlusFill/> }
                </button>
              </li>
            ))}
          </ul>
        ) : query && !isLoading ? (
          <p>No results found</p>
        ) : null}
      </div>
      <div className="bg-foreground p-4 rounded-md mb-4">
        <h3
          className="text-lg font-semibold cursor-pointer flex justify-between items-center"
          onClick={toggleOutgoing}
        >
          Outgoing
          <span className="ml-2">
            <RiArrowDropDownLine
              className={`w-8 h-8 transition-transform duration-300 ${
                ShowOutgoing ? "rotate-180" : "rotate-0"
              }`}
            />
          </span>
        </h3>

        {ShowOutgoing && // Add this condition to control visibility
          (isLoadingOutgoingRequests ? (
            "Loading..."
          ) : outgoingRequests && outgoingRequests.length > 0 ? (
            <ul className="group mt-4">
              {outgoingRequests.map((request) => (
                <li key={request.to._id}>
                  <div className="flex justify-between items-center p-2 rounded-md mb-4">
                    <div className="flex w-12 h-12 gap-4">
                      <img
                        className="object-cover rounded-md"
                        src={
                          request.to.profileImg
                            ? request.to.profileImg
                            : "/avatar-placeholder.png"
                        }
                        alt={`${request.to.username}'s profile`}
                      />
                      <div>
                        <p className="font-medium">{request.to.username}</p>
                        <p className="text-gray-400 text-sm whitespace-nowrap">
                          {request.to.bio}
                        </p>
                      </div>
                    </div>
                    <div className="font-light text-sm">
                      <div className="bg-primary text-white px-6 py-2 rounded mr-2">
                        {request.status}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p>No outgoing requests</p>
          ))}
      </div>

      <div className="rounded-md">
        {isLoadingIncommingRequests
          ? "Loading..."
          : IncommingRequests &&
            IncommingRequests.length > 0 && (
              <ul className="group">
                {IncommingRequests.map((request) => (
                  <li key={request._id}>
                    <div className="flex justify-between items-center p-2 rounded-md mb-4 group-hover:bg-foreground">
                      <div className="flex w-12 h-12 gap-4 ">
                        <img
                          className="object-cover rounded-md"
                          src={
                            request.from.profileImg
                              ? request.from.profileImg
                              : "/avatar-placeholder.png"
                          }
                          alt={`${request.from.username}'s profile`}
                        />
                        <div>
                          <p className="font-medium">{request.from.username}</p>
                          <p className="text-gray-400 text-sm whitespace-nowrap">
                            {request.from.bio}
                          </p>
                        </div>
                      </div>
                      <div className="font-light text-sm">
                        <button
                          className="bg-primary  text-white px-6 py-2 rounded mr-2"
                          onClick={() => handleAcceptRequest(request._id)}
                        >
                          {isAccepting ? "Accepting" : "Accept"}
                        </button>
                        <button
                          className="bg-primary text-white px-6 py-2 rounded"
                          onClick={() => handleDeclineRequest(request._id)}
                        >
                          {isDeclining ? "Declining" : "Decline"}
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
      </div>
    </div>
  );
}

export default ChatList;
