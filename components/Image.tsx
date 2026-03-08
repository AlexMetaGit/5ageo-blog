import NextImage, { ImageProps } from 'next/image'

const basePath = process.env.BASE_PATH

const isAbsoluteUrl = (src: string) => /^(?:[a-z][a-z\d+\-.]*:)?\/\//i.test(src)

const Image = ({ src, ...rest }: ImageProps) => {
  if (typeof src !== 'string') {
    return <NextImage src={src} {...rest} />
  }

  const resolvedSrc = isAbsoluteUrl(src) ? src : `${basePath || ''}${src}`
  return <NextImage src={resolvedSrc} {...rest} />
}

export default Image
