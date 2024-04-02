function App(): JSX.Element {

  const handleAccountGetAll = async () => {
    await window.account.accountGetAll()
  }

  const handleAccountCreate = async () => {
    console.log('its eya: ' + await window.account.accountCreate())
  }

  const handleAccountFindOne = async () => {
    console.log('its eya: ' + await window.account.accountFindOne())
  }

  const handleAccountFindById = async () => {
    console.log('its eya: ' + await window.account.accountFindById())
  }

  const handleAccountFindOneAndUpdate = async () => {
    console.log('its eya: ' + await window.account.accountFindOneAndUpdate())
  }

  const handleAccountFindOneAndDelete = async () => {
    console.log('its eya: ' + await window.account.accountFindOneAndDelete())
  }

  return (
    <div>
      <div className="bg-amber-600" onClick={() => handleAccountGetAll()}>gettall</div>
      <div className="bg-amber-600" onClick={() => handleAccountCreate()}>create</div>
      <div className="bg-amber-600" onClick={() => handleAccountFindOne()}>findone</div>
      <div className="bg-amber-600" onClick={() => handleAccountFindById()}>findbyid</div>
      <div className="bg-amber-600" onClick={() => handleAccountFindOneAndUpdate()}>findoneanupdate</div>
      <div className="bg-amber-600" onClick={() => handleAccountFindOneAndDelete()}>findoneanddelete</div>
    </div>
  )
}

export default App
