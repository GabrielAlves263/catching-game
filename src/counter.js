export function setupCounter(element) {
  let counter = 0;

  const setCounter = (count) => {
    counter = count;
    element.innerHTML = `count is ${counter}`;

    // Verifica se o jogo acabou
    if (counter < 0) {
      showGameOver();
    }
  };
  setCounter(0);
}  