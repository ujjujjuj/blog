export type Config = {
  owner: string
  url: string
  title: string
  description: string
  theme: string
  links: Array<{
    text: string
    url: string
  }>
  gtag: string
}

type Author = {
  name: string
  url: string
}

export type Metadata = {
  author: Author
  date: string
  title: string
}

export type Blog = {
  title: string
  author: Author
  slug: string
  date: string
  description: string
  link: string
}
