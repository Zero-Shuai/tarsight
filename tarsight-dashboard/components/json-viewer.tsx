// Clean JSON viewer component with syntax highlighting
import { memo } from 'react'
import { COLOR_VALUES } from '@/lib/constants/chart'

interface JsonViewerProps {
  data: any
}

function JsonViewerComponent({ data }: JsonViewerProps) {
  if (!data) return <span className="text-slate-400 italic">null</span>

  try {
    const jsonString = typeof data === 'string' ? data : JSON.stringify(data, null, 2)

    return (
      <pre className="text-xs font-mono whitespace-pre-wrap overflow-x-auto">
        {jsonString.split('\n').map((line, index) => (
          <div key={index} className="hover:bg-slate-100 px-1 rounded">
            <HighlightJsonLine line={line} />
          </div>
        ))}
      </pre>
    )
  } catch {
    return (
      <pre className="text-xs font-mono whitespace-pre-wrap overflow-x-auto text-slate-500">
        {String(data)}
      </pre>
    )
  }
}

// Component to highlight a single line of JSON
function HighlightJsonLine({ line }: { line: string }) {
  let highlighted = line

  // Highlight keys (before colon)
  highlighted = highlighted.replace(
    /(".*?")\s*:/g,
    `<span class="text-[#8B5CF6]">$1</span><span class="text-slate-500">:</span>`
  )

  // Highlight string values (after colon)
  highlighted = highlighted.replace(
    /:\s*("(?:[^"\\]|\\.)*")/g,
    '<span class="text-slate-500">:</span> <span class="text-[#10B981]">$1</span>'
  )

  // Highlight numbers
  highlighted = highlighted.replace(
    /:\s*(\d+(?:\.\d+)?(?:[eE][+\-]?\d+)?)/g,
    '<span class="text-slate-500">:</span> <span class="text-[#3B82F6] font-semibold">$1</span>'
  )

  // Highlight booleans and null
  highlighted = highlighted.replace(
    /:\s*(true|false|null)/g,
    '<span class="text-slate-500">:</span> <span class="text-[#F59E0B] font-semibold">$1</span>'
  )

  return <span dangerouslySetInnerHTML={{ __html: highlighted }} />
}

export const JsonViewer = memo(JsonViewerComponent)
