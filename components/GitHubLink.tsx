import Image from 'next/image'

interface GitHubLinkProps {
  repoUrl: string
}

export function GitHubLink({ repoUrl }: GitHubLinkProps) {
  return (
    <a
      href={repoUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-4 left-4 z-50"
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