function App(): JSX.Element {

  const handleAccountGetAll = async () => {
    await window.account.accountGetAll()
  }

  const handleAccountCreate = async () => {
    await window.account.accountCreate()
  }

  return (
    <div>
      <div className="bg-amber-600" onClick={() => handleAccountGetAll()}>gettall</div>
      <div className="bg-amber-600" onClick={() => handleAccountCreate()}>create</div>
    </div>
  )
}

export default App
