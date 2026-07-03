import { ScrollViewStyleReset } from 'expo-router/html';

const globalCss = `
html, body, #root {
  height: 100%;
  width: 100%;
}
body {
  margin: 0;
  background-color: #d8d8d8;
  overflow: hidden;
}
#root {
  display: flex;
  flex-direction: column;
}
`;

export default function Root({ children }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
        />
        <meta name="theme-color" content="#FDB913" />
        <title>Astrotalk</title>
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: globalCss }} />
      </head>
      <body>{children}</body>
    </html>
  );
}