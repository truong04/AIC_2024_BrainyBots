export default (initialState: API.UserInfo) => {
  // Define the permissions in the project according to the initialization data here and manage them uniformly
  // Reference document https://umijs.org/docs/max/access
  const canSeeAdmin = !!(
    initialState && initialState.name !== 'dontHaveAccess'
  );
  return {
    canSeeAdmin,
  };
};
