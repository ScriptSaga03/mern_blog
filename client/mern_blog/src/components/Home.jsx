import { Fragment } from "react";
import Posts from "./Posts";

function Home() {
  return (
    <>
      <section
        id="main-container"
        className="bg-white w-full p-6 min-h-screen flex justify-center"
      >
        <div className="max-w-6xl w-full ">
            <Posts/>
        </div>
      </section>
    </>
  );
}

export default Home;
