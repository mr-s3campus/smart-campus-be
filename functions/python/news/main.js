import { spawn } from "child_process";

export const writeNews = async function () {
  try {
    // console.log("writing news...");

    const ls = spawn("python3", ["python/news/main.py"]);

    const exit = (data) => {
      if (data) {
        let parsed = JSON.parse(data);
        if (parsed?.length > 0) {
          return parsed;
        } else {
          return [];
        }
      } else {
        return [];
      }
    };

    let scriptOutput = "";
    for await (const chunk of ls.stdout) {
      // console.log("stdout chunk: " + chunk);
      scriptOutput += chunk;
    }
    let error = "";
    for await (const chunk of ls.stderr) {
      // console.error("stderr chunk: " + chunk);
      error += chunk;
    }
    const exitCode = await new Promise((resolve, reject) => {
      ls.on("close", resolve);
    });

    if (exitCode) {
      throw new Error(`subprocess error exit ${exitCode}, ${error}`);
    }
    return exit(scriptOutput);
  } catch (err) {
    console.log(err);
    return [];
  }
};
