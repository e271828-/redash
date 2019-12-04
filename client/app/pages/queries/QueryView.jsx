import React, { useMemo, useState, useEffect } from 'react';
import { find } from 'lodash';
import PropTypes from 'prop-types';
import { react2angular } from 'react2angular';
import Divider from 'antd/lib/divider';
import Button from 'antd/lib/button';
import Icon from 'antd/lib/icon';
import { EditInPlace } from '@/components/EditInPlace';
import { Parameters } from '@/components/Parameters';
import { TimeAgo } from '@/components/TimeAgo';
import { currentUser } from '@/services/auth';
import QueryHeader from './components/QueryHeader';

import { IMG_ROOT, DataSource } from '@/services/data-source';
import QueryVisualizationTabs from './components/QueryVisualizationTabs';
import { EditVisualizationButton } from '@/components/EditVisualizationButton';
import useQueryResult from '@/lib/hooks/useQueryResult';
import { pluralize } from '@/filters';

function QueryView({ query }) {
  const canEdit = useMemo(() => (currentUser.canEdit(query) || query.can_edit), [query]);
  const parameters = useMemo(() => query.getParametersDefs(), [query]);
  const [dataSource, setDataSource] = useState();
  const queryResult = useMemo(() => query.getQueryResult(), [query.getQueryResult()]);
  const queryResultData = useQueryResult(queryResult);

  useEffect(() => {
    Promise.all([DataSource.types().$promise, DataSource.get({ id: query.data_source_id }).$promise])
      .then(values => setDataSource({ ...values[1], typeInfo: find(values[0], { type: values[1].type }) }));
  }, [query]);
  return (
    <div className="query-page-wrapper">
      <div className="container">
        <QueryHeader query={query} canEdit={canEdit} />
        <div className="query-metadata tiled bg-white p-15">
          <EditInPlace
            className="w-100"
            value={query.description}
            isEditable={canEdit}
            editor="textarea"
            placeholder="Add description"
            ignoreBlanks
          />
          <Divider />
          <div className="d-flex flex-wrap">
            <div className="m-r-20 m-b-10">
              <img src={query.user.profile_image_url} className="profile__image_thumb" alt={query.user.name} />
              <strong>{query.user.name}</strong>
              {' created '}
              <TimeAgo date={query.created_at} />
            </div>
            <div className="m-r-20 m-b-10">
              <img src={query.user.profile_image_url} className="profile__image_thumb" alt={query.last_modified_by.name} />
              <strong>{query.last_modified_by.name}</strong>
              {' updated '}
              <TimeAgo date={query.updated_at} />
            </div>
            {dataSource && (
              <div className="m-r-20 m-b-10">
                <img src={`${IMG_ROOT}/${dataSource.type}.png`} width="20" alt={dataSource.typeInfo.name} />
                {dataSource.name}
              </div>
            )}
          </div>
        </div>
        <div className="query-content tiled bg-white p-15 m-t-15">
          {query.hasParameters() && <Parameters parameters={parameters} />}
          <QueryVisualizationTabs queryResult={queryResult} visualizations={query.visualizations} />
          <div className="d-flex align-items-center">
            <EditVisualizationButton />
            <Button className="icon-button hidden-xs">
              <Icon type="ellipsis" rotate={90} />
            </Button>
            {queryResultData && (
              <div className="flex-fill m-l-5">
                <strong>{queryResultData.rows.length}</strong>{' '}
                {pluralize('row', queryResultData.rows.length)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

QueryView.propTypes = { query: PropTypes.object.isRequired }; // eslint-disable-line react/forbid-prop-types

export default function init(ngModule) {
  ngModule.component('pageQueryView', react2angular(QueryView));

  return {
    '/queries-react/:queryId': {
      template: '<page-query-view query="$resolve.query"></page-query-view>',
      layout: 'fixed',
      reloadOnSearch: false,
      resolve: {
        query: (Query, $route) => {
          'ngInject';

          return Query.get({ id: $route.current.params.queryId }).$promise;
        },
      },
    },
  };
}

init.init = true;
