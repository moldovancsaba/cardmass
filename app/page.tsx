import fs from 'fs';
import path from 'path';

export default function Home() {
  const publicPath = path.join(process.cwd(), 'public');
  let files: string[] = [];
  try {
    files = fs.readdirSync(publicPath);
  } catch (_e) {}

  return (
    <div>
      <h1>Hello, World!</h1>
      <h2>Files in /public:</h2>
      <ul>
        {files.map(f => (
          <li key={f}>
            <a href={`/${f}`}>{f}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}
