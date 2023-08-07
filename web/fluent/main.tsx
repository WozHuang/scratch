import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { FluentProvider, teamsLightTheme, Button } from '@fluentui/react-components';
import { createRef, forwardRef, useImperativeHandle, useState } from 'react';

class App extends React.Component<any, any> {
  state = {
    time: new Date().toLocaleTimeString()
  };

  updateTime() {
    this.setState({
      time: new Date().toLocaleTimeString()
    });
  }

  render() {
    return (
      <div>
        <span>{this.state.time}</span>
        <Button appearance='primary'>123</Button>
      </div>
    );
  }
}

type App2Ref = {
  updateTime: () => void;
}

const App2 = forwardRef<App2Ref>((props, ref) => {
  const [time, setTime] = useState(new Date().toLocaleTimeString());
  const updateTime = () => {
    setTime(new Date().toLocaleTimeString());
  };

  useImperativeHandle(ref, () => ({
    updateTime
  }));

  return (
    <div>
      <span>{time}</span>
      <Button appearance='primary'>123</Button>
    </div>
  );
});

const root = createRoot(document.getElementById('root') as HTMLElement);
const appRef = createRef<App>();
const app2Ref = createRef<App2Ref>();

function renderRoot() {
  root.render(
    <FluentProvider theme={teamsLightTheme}>
      <App ref={appRef} />
      <App2 ref={app2Ref} />
    </FluentProvider>
  );
}

renderRoot();
setInterval(() => {
  // renderRoot(); // 直接调用 render 也可以实现更新
  console.log({
    appRef: appRef.current,
    app2Ref: app2Ref.current
  });
// 使用 ref 在外部触发组件更新
  appRef.current?.updateTime();
  app2Ref.current?.updateTime()
}, 1000);

