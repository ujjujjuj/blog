const { marked } = require("marked");
const fs = require("fs-extra");
const Mustache = require("mustache");
const yaml = require("js-yaml");
const cheerio = require("cheerio");

const getDesc = (html) => {
  const $ = cheerio.load(html);
  return $("p").first().text().split("\n")[0];
};

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
    const title = content.split("#")[1].split("\n")[0];
    const description = getDesc(parsedContent);

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

    blogs.push({ title, author, slug, date, description });
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

  //
  console.log("Generating RSS feed");
  const blogXml = blogs.map((blog) => {
    blog.link = config.url + "/" + blog.slug;
    blog.date = new Date(blog.date).toUTCString();
    return blog;
  });
  const rssXml = Mustache.render(
    fs.readFileSync(`theme/${config.theme}/feed.xml`).toString(),
    { ...config, blogs: blogXml }
  );
  fs.writeFileSync("build/rss.xml", rssXml);

  console.log("Done");
};

build();
