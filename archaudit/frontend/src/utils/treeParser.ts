/**
 * Parses a string representation of a file tree into a JSON object.
 * Supports standard indentation (spaces/tabs) as well as CLI `tree` output characters.
 */
export function parseTextToStructure(text: string): Record<string, any> {
  const lines = text.split('\n');
  
  // 1. Clean up lines and filter out noise
  const cleanLines = lines
    .map(line => {
      // Remove common shell prompts
      let content = line.replace(/^[❯$#>]\s*/, '');
      
      // If it's a tree command line or headers, ignore it
      const trimmed = content.trim();
      if (trimmed.startsWith('tree ') || 
          trimmed === 'tree' || 
          trimmed.startsWith('Folder PATH listing') ||
          trimmed.startsWith('Volume serial number')) {
        return null;
      }
      
      // Remove tree characters but keep spacing for indentation
      // Standard: ├── └── │
      // ASCII: +--- \--- |
      // We also include common variations
      const indentationMatch = content.match(/^([├─└│\s\+\-\|\\/]+)/);
      const indentationPart = indentationMatch ? indentationMatch[0] : '';
      
      // The name part is what's left after the indentation characters
      let namePart = content.substring(indentationPart.length).trim();
      
      // Edge case: if namePart is empty, it might be that the whole line was "tree characters" (unlikely but possible)
      if (!namePart) return null;

      // Filter out root indicators
      if (namePart === '.' || namePart === './' || namePart === '..') {
        return null;
      }

      // Calculate effective indentation
      // We replace all non-space tree characters with spaces to get the true visual depth
      const indent = indentationPart.replace(/[├─└│\+\-\|\\/]/g, ' ').length;
      
      return {
        name: namePart.replace(/\/$/, ''),
        indent,
        isExplicitFolder: namePart.endsWith('/')
      };
    })
    .filter((line): line is { name: string, indent: number, isExplicitFolder: boolean } => line !== null);

  const structure: Record<string, any> = {};
  const pathStack: { indent: number, node: Record<string, any> }[] = [{ indent: -1, node: structure }];

  for (let i = 0; i < cleanLines.length; i++) {
    const { name, indent, isExplicitFolder } = cleanLines[i];
    const nextLine = cleanLines[i + 1];
    
    // Determine if it's a folder:
    // 1. Ends with /
    // 2. Next line has more indentation
    const isFolder = isExplicitFolder || (nextLine && nextLine.indent > indent);

    // Pop from stack until we find the parent
    while (pathStack.length > 1 && indent <= pathStack[pathStack.length - 1].indent) {
      pathStack.pop();
    }

    const currentParent = pathStack[pathStack.length - 1].node;

    if (isFolder) {
      // If it's already there and is a file (true), convert it to a folder
      if (typeof currentParent[name] !== 'object') {
        currentParent[name] = {};
      }
      pathStack.push({ indent, node: currentParent[name] });
    } else {
      // Only set to true if it doesn't already exist as a folder
      if (!currentParent[name]) {
        currentParent[name] = true;
      }
    }
  }

  return structure;
}


