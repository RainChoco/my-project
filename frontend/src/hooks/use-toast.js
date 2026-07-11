import * as React from "react"

// Module-level toast store, matching shadcn/ui's use-toast API (toast({...}) callable
// from anywhere, <Toaster/> subscribes to the shared state) but without the Radix Toast
// primitive - this app doesn't have @radix-ui/react-toast installed, and a plain
// auto-dismissing stack covers the "toast feedback" requirement without adding a dependency.
const TOAST_LIMIT = 3;
const TOAST_AUTO_DISMISS_MS = 4000;

let count = 0;
function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

const listeners = [];
let memoryState = { toasts: [] };

function dispatch(action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => listener(memoryState));
}

function reducer(state, action) {
  switch (action.type) {
    case "ADD_TOAST":
      return { ...state, toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT) };
    case "REMOVE_TOAST":
      return { ...state, toasts: state.toasts.filter((t) => t.id !== action.toastId) };
    default:
      return state;
  }
}

function toast({ title, description, variant = "default" }) {
  const id = genId();
  const dismiss = () => dispatch({ type: "REMOVE_TOAST", toastId: id });

  dispatch({ type: "ADD_TOAST", toast: { id, title, description, variant, dismiss } });
  setTimeout(dismiss, TOAST_AUTO_DISMISS_MS);

  return { id, dismiss };
}

function useToast() {
  const [state, setState] = React.useState(memoryState);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) listeners.splice(index, 1);
    };
  }, []);

  return { toasts: state.toasts, toast };
}

export { useToast, toast };
