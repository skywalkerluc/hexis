export type AuthFormState = {
  status: "idle" | "error";
  formError?: string;
  fieldErrors: {
    email?: string;
    password?: string;
    displayName?: string;
  };
};

export const INITIAL_AUTH_FORM_STATE: AuthFormState = {
  status: "idle",
  fieldErrors: {},
};
