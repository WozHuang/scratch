import * as React from 'react';
import { createRoot } from "react-dom/client";
import { FluentProvider, teamsLightTheme, Button } from "@fluentui/react-components";

const App = () => <div>
  <Button appearance="primary">123</Button>
</div>;

const root = document.getElementById("root") as HTMLElement;
createRoot(root).render(
  <FluentProvider theme={teamsLightTheme}>
    <App />
  </FluentProvider>
);
