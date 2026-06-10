using FluentValidation;
using MediatR;
using MessengerApp.Domain.Common;

namespace MessengerApp.Application.Common.Behaviors;

public class ValidationBehavior<TRequest, TResponse>(IEnumerable<IValidator<TRequest>> validators)
    : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{
    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        if (!validators.Any())
        {
            return await next();
        }

        var context = new ValidationContext<TRequest>(request);

        var validationResults = await Task.WhenAll(
            validators.Select(v => v.ValidateAsync(context, cancellationToken)));

        var failures = validationResults
            .Where(r => r.Errors.Count != 0)
            .SelectMany(r => r.Errors)
            .ToList();

        if (failures.Count != 0)
        {
            if (typeof(TResponse).IsGenericType &&
                typeof(TResponse).GetGenericTypeDefinition() == typeof(Result<>))
            {
                var errorType = typeof(TResponse).GetGenericArguments()[0];
                var validationErrors = failures
                    .Select(f => Error.Validation(f.PropertyName, f.ErrorMessage))
                    .ToArray();

                var failureMethod = typeof(Result)
                    .GetMethods()
                    .First(m => m.Name == nameof(Result.Failure) && m.IsGenericMethodDefinition)
                    .MakeGenericMethod(errorType);

                return (TResponse)failureMethod.Invoke(null, [new ValidationError(validationErrors)])!;
            }

            if (typeof(TResponse) == typeof(Result))
            {
                var validationErrors = failures
                    .Select(f => Error.Validation(f.PropertyName, f.ErrorMessage))
                    .ToArray();

                return (TResponse)(object)Result.Failure(new ValidationError(validationErrors));
            }

            throw new ValidationException(failures);
        }

        return await next();
    }
}
