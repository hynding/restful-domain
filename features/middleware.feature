Feature: As a RESTful API developer, I want a convenient middleware to service SCRUD network requests and responses against a collection of data.

  Scenario: Search a collection
    Given I have the following data collection
      | id | name | text |
      | 1  | Fred | foo  |
      | 2  | Beth | bar  |
      | 3  | Fran | foo  |
    And I am opting to use Restify
    And I am opting to Mongoose
    And I create a service with my options to extend RestfulDomain
    When I search the text field for foo
    Then I am returned an array
    And it contains entry id 1
    And it contains entry id 3
    And it does not contain entry id 2

  Scenario: Create a data object
    Given I have a model schema with string fields for name and text
    When I

  Scenario: Read a data object

  Scenario: Update a data object

  Scenario: Destroy a data object