

export const Forwarder = () => {


}

export let forwarder: ReturnType<typeof Forwarder>;

export const initTaskQueue = () => {
  forwarder = Forwarder()
  return forwarder
}