const { marked } = require("marked");
const fs = require("fs-extra");
const Mustache = require("mustache");
const yaml = require("js-yaml");
const cheerio = require("cheerio");
const slugify = require("slugify");

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
    const allContent = fs.readFileSync(`content/blogs/${blog}`).toString();
    const [metadata, content] = allContent
      .split("---")
      .slice(1)
      .map((x) => x.trim());

    const { title, author, date } = yaml.load(metadata);

    let parsedContent = marked.parse(content);
    const slug = slugify(title, { lower: true, strict: true });
    const description = getDesc(parsedContent);
    const link = config.url + "/" + slug;
    // process.exit(0);

    fs.writeFileSync(
      `build/${slug}.html`,
      Mustache.render(blogTemplate, {
        ...config,
        content: parsedContent,
        title,
        description,
        author,
        date,
        slug,
        link,
      })
    );

    blogs.push({ title, author, slug, date, description, link });
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
