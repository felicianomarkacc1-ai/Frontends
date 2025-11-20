// src/components/PrivateRoute.tsx
import React from 'react';
import { Route, Redirect, RouteProps } from 'react-router-dom';

interface PrivateRouteProps extends RouteProps {
  role?: 'admin' | 'member';
  component: React.ComponentType<any>;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ role, component: Component, ...rest }) => {
  const isAuthenticated = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  return (
    <Route
      {...rest}
      render={props => {
        if (!isAuthenticated) {
          return <Redirect to="/home" />;
        }

        if (role && user.role !== role) {
          return <Redirect to={user.role === 'admin' ? '/admin' : '/member'} />;
        }

        return <Component {...props} />;
      }}
    />
  );
};

export default PrivateRoute;