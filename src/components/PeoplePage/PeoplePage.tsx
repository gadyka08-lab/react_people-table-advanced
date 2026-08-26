/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useState } from 'react';
import { Loader } from '../Loader/Loader';
import { Person } from '../../types';
import { PersonLink } from '../PersonLink/PersonLink';
import { useParams, useSearchParams } from 'react-router-dom';
import { PeopleFilters } from '../PeopleFilters';
import { SearchLink } from '../SearchLink';
import { getPeople } from '../../api';

export const PeoplePage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [people, setPeople] = useState<Person[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    setIsLoading(true);
    setHasError(false);

    getPeople()
      .then(data => {
        setPeople(data);
      })
      .catch(() => {
        setHasError(true);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const query = searchParams.get('query') || '';
  const centuries = searchParams.getAll('centuries');
  const sex = searchParams.get('sex');
  const sortField = searchParams.get('sort');
  const orderField = searchParams.get('order');

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const newParams = new URLSearchParams(searchParams.toString());

    if (value) {
      newParams.set('query', value);
    } else {
      newParams.delete('query');
    }

    setSearchParams(newParams);
  };

  const getSortedPeople = (
    peopleList: Person[],
    sort: string | null,
    order: string | null,
  ) => {
    return [...peopleList].sort((personA, personB) => {
      switch (sort) {
        case 'name':
          return (
            personA.name.localeCompare(personB.name) *
            (order === 'desc' ? -1 : 1)
          );
        case 'born':
          return (personA.born - personB.born) * (order === 'desc' ? -1 : 1);
        case 'died':
          return (personA.died - personB.died) * (order === 'desc' ? -1 : 1);
        case 'sex':
          return (
            personA.sex.localeCompare(personB.sex) * (order === 'desc' ? -1 : 1)
          );
        default:
          return 0;
      }
    });
  };

  const sortedPeople = getSortedPeople(people, sortField, orderField);

  const visiblePeople = sortedPeople.filter(person => {
    const nameMatch =
      person.name.toLowerCase().includes(query.toLowerCase()) ||
      person.motherName?.toLowerCase().includes(query.toLowerCase()) ||
      person.fatherName?.toLowerCase().includes(query.toLowerCase());
    const centuryOfPeople = Math.ceil(person.born / 100);
    const matchesCenturies =
      centuries.length === 0 || centuries.includes(String(centuryOfPeople));
    const matchesSex = !sex || person.sex === sex;

    return nameMatch && matchesCenturies && matchesSex;
  });

  const currentSort = searchParams.get('sort');
  const currentOrder = searchParams.get('order');
  const sortIcon = currentOrder === 'desc' ? '▼' : '▲';

  return (
    <>
      <div>
        <h1 className="title">People Page</h1>
      </div>

      <div className="columns">
        <div className="column">
          <div className="box table-container">
            {isLoading && <Loader />}

            {hasError && !isLoading && (
              <p data-cy="peopleLoadingError" className="has-text-danger">
                Something went wrong
              </p>
            )}

            {!isLoading && people.length === 0 && (
              <p data-cy="noPeopleMessage">There are no people on the server</p>
            )}

            {!isLoading && !hasError && people.length > 0 && (
              <table
                data-cy="peopleTable"
                className="table is-striped is-hoverable is-narrow is-fullwidth"
              >
                <thead>
                  <tr>
                    <th>
                      <SearchLink
                        params={{
                          sort: 'name',
                          order:
                            currentSort === 'name' && currentOrder === 'asc'
                              ? 'desc'
                              : currentSort === 'name' &&
                                  currentOrder === 'desc'
                                ? null
                                : 'asc',
                        }}
                      >
                        Name {currentSort === 'name' && sortIcon}
                      </SearchLink>
                    </th>
                    <th>
                      <SearchLink
                        params={{
                          sort: 'sex',
                          order:
                            currentSort === 'sex' && currentOrder === 'asc'
                              ? 'desc'
                              : currentSort === 'sex' && currentOrder === 'desc'
                                ? null
                                : 'asc',
                        }}
                      >
                        Sex{currentSort === 'sex' && sortIcon}
                      </SearchLink>
                    </th>
                    <th>
                      <SearchLink
                        params={{
                          sort: 'born',
                          order:
                            currentSort === 'born' && currentOrder === 'asc'
                              ? 'desc'
                              : currentSort === 'born' &&
                                  currentOrder === 'desc'
                                ? null
                                : 'asc',
                        }}
                      >
                        Born{currentSort === 'born' && sortIcon}
                      </SearchLink>
                    </th>
                    <th>
                      <SearchLink
                        params={{
                          sort: 'died',
                          order:
                            currentSort === 'died' && currentOrder === 'asc'
                              ? 'desc'
                              : currentSort === 'died' &&
                                  currentOrder === 'desc'
                                ? null
                                : 'asc',
                        }}
                      >
                        Died{currentSort === 'died' && sortIcon}
                      </SearchLink>
                    </th>
                    {people.map(person => (
                      <tr key={person.slug}>
                        <td>{person.name}</td>
                        <td>{person.motherName || '-'}</td>
                        <td>{person.fatherName || '-'}</td>
                      </tr>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {visiblePeople.map(person => {
                    const mother = people.find(
                      p => p.name === person.motherName,
                    );
                    const father = people.find(
                      p => p.name === person.fatherName,
                    );

                    return (
                      <tr
                        data-cy="person"
                        key={person.slug}
                        className={
                          slug === person.slug ? 'has-background-warning' : ''
                        }
                      >
                        <td>
                          <PersonLink person={person} />
                        </td>
                        <td>{person.sex}</td>
                        <td>{person.born}</td>
                        <td>{person.died}</td>
                        <td>
                          {mother ? (
                            <PersonLink person={mother} />
                          ) : (
                            person.motherName || '-'
                          )}
                        </td>
                        <td>
                          {father ? (
                            <PersonLink person={father} />
                          ) : (
                            person.fatherName || '-'
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="column is-one-quarter">
          {!isLoading && people.length > 0 && (
            <PeopleFilters query={query} onQueryChange={handleQueryChange} />
          )}
        </div>
      </div>
    </>
  );
};
