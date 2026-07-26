import AppHead from "@/components/AppHead";
import PrivateHome from "@/components/PrivateHome";

const home = () => {
  return (
    <>
      <AppHead title="Home" />
      <PrivateHome />
    </>
  );
};

export default home;
