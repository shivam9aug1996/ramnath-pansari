import { baseUrl } from "@/redux/constants";

export const generateText = async (prompt: string, token:string) => {
  const res = await fetch(
    `${baseUrl}/generateGreeting`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ prompt }),
    }
  );
  const data = await res.json();
  console.log("res67890-",data)
  return data?.text
};


export const getTimeOfDay = () => {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) {
    return "morning";
  } else if (hour >= 12 && hour < 17) {
    return "afternoon";
  } else if (hour >= 17 && hour < 21) {
    return "evening";
  } else {
    return "night";
  }
};