import Image from 'next/image'

// GitHub link component
interface GitHubLinkProps {
  repoUrl: string
}

export function GitHubLink({ repoUrl }: GitHubLinkProps) {
  return (
    <a
      href={repoUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="w-6 h-6"
    >
      <Image
        src="/github-mark-white.svg"
        alt="GitHub"
        width={24}
        height={24}
        className="opacity-50 hover:opacity-100 transition-opacity"
      />
    </a>
  )
}