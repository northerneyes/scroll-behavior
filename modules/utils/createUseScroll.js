function defaultShouldUpdateScroll() {
  return true
}

export default function createUseScroll(updateState, updateScroll, start, stop) {
  return function (createHistory) {
    return function (options = {}) {
      const {
        shouldUpdateScroll = defaultShouldUpdateScroll,
        ...historyOptions
      } = options

      const history = createHistory(historyOptions)

      let numListeners = 0

      function checkStart() {
        if (++numListeners === 1 && start) {
          start(history)
        }
      }

      function checkStop() {
        if (--numListeners === 0 && stop) {
          stop()
        }
      }

      function listenBefore(hook) {
        checkStart()
        const unlisten = history.listenBefore(hook)

        return function () {
          unlisten()
          checkStop()
        }
      }

      let oldLocation
      let listeners = [], currentLocation, unlisten

      function onChange(location) {
        oldLocation = currentLocation
        currentLocation = location

        listeners.forEach(listener => listener(location))
        if (shouldUpdateScroll(oldLocation, currentLocation)) {
          updateScroll(location)
        } else {
          updateState(location)
        }
      }

      function listen(listener) {
        checkStart()

        if (listeners.length === 0) {
          unlisten = history.listen(onChange)
        }

        // Add the listener to the list afterward so we can manage calling it
        // initially with the current location.
        listeners.push(listener)
        listener(currentLocation)

        return function () {
          listeners = listeners.filter(item => item !== listener)
          if (listeners.length === 0) {
            unlisten()
          }

          checkStop()
        }
      }

      return {
        ...history,
        listenBefore,
        listen
      }
    }
  }
}
