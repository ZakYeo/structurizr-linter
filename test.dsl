workspace {

  model {
    user = person "User" "A person that uses the system"
    
    softwareSystem = softwareSystem "Payment System" "Processes payments" {
      
      webApp = container "Web Application" "Allows users to view and manage payments" "React"
      api = container "API" "Handles business logic" "Node.js" {
        paymentComponent = component "Payment Processor" "Processes card transactions" "TypeScript"
        fraudCheck = component "Fraud Checker" "Checks for fraud" "Python"

        paymentComponent -> fraudCheck "Uses for fraud detection"
      }

      webApp -> api "Calls API"
      user -> webApp "Uses via browser"
    }

    legacySystem = softwareSystem "Old Payment Processor" "Deprecated" {
      db = container "Database" "Stores payment info" "MySQL"
    }

    api -> legacySystem.db "Reads legacy data"
  }

  views {
    systemContext user softwareSystem
    container softwareSystem
    component api
  }

  documentation softwareSystem {
    context {
      format markdown
      content "This

