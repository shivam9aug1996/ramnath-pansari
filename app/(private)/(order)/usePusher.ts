import { useState, useEffect } from "react";
import { Pusher } from "@pusher/pusher-websocket-react-native";

const usePusher = (appKey, appCluster) => {
  const [pusherInstance, setPusherInstance] = useState(null);
  const [channel, setChannel] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const startSocket = ()=>{

  }

  const closeSocket = ()=>{
    
  }

  // const startSocket = async (channelName, eventName) => {
  //   try {
  //     if (channel) {
  //       await channel.unsubscribe();
  //       setChannel(null);
  //     }

  //     if (pusherInstance) {
  //       await pusherInstance.disconnect();
  //       setPusherInstance(null);
  //       setIsConnected(false);
  //     }
  //     // Initialize Pusher instance inside startSocket
  //     const pusher = Pusher.getInstance();

  //     await pusher.init({
  //       apiKey: appKey,
  //       cluster: appCluster,
  //     });

  //     await pusher.connect();
  //     setPusherInstance(pusher);
  //     setIsConnected(true);

  //     if (channelName && eventName) {
  //       const newChannel = await pusher.subscribe({
  //         channelName,
  //         onEvent: (event) => {
  //           if (event?.data) {
  //             setMessage(JSON.parse(event?.data));
  //           }
  //         },
  //       });
  //       setChannel(newChannel);
  //     } else {
  //       setError("Channel name or event name not provided.");
  //     }
  //   } catch (err) {
  //     setError(`Error initializing Pusher or subscribing: ${err.message}`);
  //   }
  // };

  // const closeSocket = async () => {
  //   if (channel) {
  //     await channel.unsubscribe();
  //     setChannel(null);
  //   }

  //   if (pusherInstance) {
  //     await pusherInstance.disconnect();
  //     setPusherInstance(null);
  //     setIsConnected(false);
  //   }
  // };

  return {
    isConnected,
    error,
    startSocket,
    closeSocket,
    message,
  };
};

export default usePusher;
