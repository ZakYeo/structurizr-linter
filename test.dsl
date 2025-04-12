workspace "My Software System" "Example Structurizr DSL workspace" {
  model {
    user = person "User" "A user of the system"
    softwareSystem = softwareSystem "Software System" "My software system"

    user -> softwareSystem "Uses"
  }

  views {
    systemContext softwareSystem {
      include *
      autolayout lr
    }

    styles {
      element "Person" {
        background #08427b
        color #ffffff
      }

      element "Software System" {
        background #1168bd
        color #ffffff
      }
    }
  }
}

