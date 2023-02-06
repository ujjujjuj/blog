const { marked } = require("marked");
const fs = require("fs-extra");
const Mustache = require("mustache");
const yaml = require("js-yaml");

const build = () => {
  const config = yaml.load(fs.readFileSync("./config.yml"));

  const homeTemplate = fs
    .readFileSync(`theme/${config.theme}/_index.html`)
    .toString();
  const blogTemplate = fs
    .readFileSync(`theme/${config.theme}/_blog.html`)
    .toString();

  ///////
  console.log("Starting build");

  fs.rmSync("./build", { recursive: true, force: true });
  fs.mkdirSync("./build");
  fs.copySync(`theme/${config.theme}/static/`, "build/");
  fs.copySync(`content/media/`, "build/");

  //////
  console.log("Compiling templates");

  let blogs = [];
  for (const blog of fs
    .readdirSync("content/blogs/")
    .filter((filename) => filename[0] !== "_")) {
    const content = fs.readFileSync(`content/blogs/${blog}`).toString();

    const [author, authorLink, date] = content
      .split("\n")
      .map((text) => text.slice(3, -1))
      .slice(0, 3);

    let parsedContent = marked.parse(content.slice(content.indexOf("#")));
    const slug = parsedContent.split('id="')[1].split('"')[0];
    const title = parsedContent.split('">')[1].split("</h1>")[0];
    const description = "";

    parsedContent = parsedContent.split("</h1>\n")[1];

    fs.writeFileSync(
      `build/${slug}.html`,
      Mustache.render(blogTemplate, {
        ...config,
        content: parsedContent,
        title,
        description,
        author,
        authorLink,
        date,
        slug,
      })
    );

    blogs.push({ title, author, slug, date });
  }

  blogs.sort((a, b) => (a.date < b.date ? 1 : -1));

  fs.writeFileSync(
    "build/index.html",
    Mustache.render(homeTemplate, {
      ...config,
      content: marked.parse(fs.readFileSync("content/index.md").toString()),
      blogs,
    })
  );

  console.log("Done");
};

build();
