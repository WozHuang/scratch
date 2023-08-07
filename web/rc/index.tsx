import React from 'react';
import Menu, { SubMenu, MenuItem } from 'rc-menu';
import { createRoot } from 'react-dom/client';
import Collapse from 'rc-collapse';
import 'rc-menu/assets/index.css';
import 'rc-collapse/assets/index.css';
const Panel = Collapse.Panel;

const root = document.getElementById('root') as HTMLElement;
function renderMenu() {
  return  <Menu style={{width: 300}}>
    <MenuItem>1</MenuItem>
    <SubMenu title='2'>
      <MenuItem>2-1</MenuItem>
    </SubMenu>
  </Menu>
}
function renderCollapse() {
  return  <Collapse accordion={true}>
    <Panel header="hello" headerClass="my-header-class">
      this is panel content
    </Panel>
    <Panel header="title2">this is panel content2 or other</Panel>
  </Collapse>
}

createRoot(root).render(
  <>
    {renderMenu()}
    {renderCollapse()}
  </>
);
