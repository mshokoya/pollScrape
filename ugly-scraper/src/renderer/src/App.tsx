function App(): JSX.Element {

  const handleClick = async () => {
    await window.account.demine()
  }

  return <div className="bg-amber-600" onClick={() => handleClick()}>Hello world</div>
}

export default App
