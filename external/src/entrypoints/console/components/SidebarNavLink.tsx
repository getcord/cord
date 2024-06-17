import { forwardRef } from 'react';
import { NavLink } from 'react-router-dom';

const SidebarNavLink = forwardRef<any, any>((props, ref) => {
  return (
    <NavLink
      ref={ref}
      to={props.to}
      className={({ isActive }) =>
        `${props.className} ${isActive ? props.activeClassName : ''}`
      }
      end={props.end}
    >
      {props.children}
    </NavLink>
  );
});

export default SidebarNavLink;
