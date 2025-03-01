import { test } from "vitest";
import { startServer } from "./index";

const getRecentSpace = async () => {
  const response = await fetch("http://localhost:3000/recent-space");

  try {
    await response.json();
  } catch (e) {
    console.error(e);
  }
};

test("Should start server and overload with requests to get recent space",
  async () => {
    const server = startServer(3000);

    await new Promise((resolve) => setTimeout(resolve, 500));

    for(let i = 0; i < 300; i++) {
      await new Promise((resolve) => setTimeout(resolve, 3));
      getRecentSpace();
    }

    await new Promise((resolve) => setTimeout(resolve, 5000));

    server.close();
  },
  { timeout: 15000 },
);
