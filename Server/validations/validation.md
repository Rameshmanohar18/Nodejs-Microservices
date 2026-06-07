```js

10. VALIDATIONS Folder - Input Validation
What it does: Ensures incoming data is correct before processing
Use Cases:

✅ Validate email format

✅ Check password strength

✅ Verify date ranges

✅ Sanitize user input




When to use Validations:

User input from forms/APIs ✅

Data coming from external sources ✅

Critical operations (payments, passwords) ✅


Example: src/validations/user.validation.js











Complete Use  Case Matrix
Folder	       When to Use	        Example                            Scenario	   Response Time
Config	      Application startup	   Connect to database	              N/A
Models	      Define data structure	   User schema with validation	      N/A
Controllers	   Handle HTTP requests	   API endpoint logic	                                <50ms
Services	   Business logic	       Calculate order total	                            <100ms
Repositories   Database                 queries	Get user with caching	                     <50ms
Middleware	   Cross-cutting concerns	Authentication check	                             <10ms
Utils	       Helper functions	        Format currency	                                     <1ms
Jobs	       Background tasks	        Send 1000 emails	               Async
Events	       Decoupled communication	Order placed triggers 5 actions	   Async
Validations	   Input checking	       Validate email format	                           <5ms




```
