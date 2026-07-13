using backend;
using backend.Models;
using backend.Services;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("api/countries")]
public class CountriesController : ControllerBase
{
    [HttpGet]
    public IActionResult GetCountries()
    {
        var countries = CountryCatalog.Names.Select(country =>
            new CountryInfo
            {
                Id = country.Key.ToLower(),
                IsoCode = country.Key,
                Name = country.Value
            }
        );

        return Ok(countries);
    }
}
