/**
 * SPDX-FileCopyrightText: (c) 2000 Liferay, Inc. https://liferay.com
 * SPDX-License-Identifier: LGPL-2.1-or-later OR LicenseRef-Liferay-DXP-EULA-2.0.0-2023-06
 */

import ClayForm from '@clayui/form';
import Checkbox from '~/components/Checkbox/Checkbox';
import Renderer from '~/components/FormRenderer/FormRenderer';
import BaseWarning from '~/pages/Admin/components/BaseWarning/BaseWarning';
import BaseWrapper from '~/pages/Admin/components/BaseWrapper/BaseWrapper';
import DateRange from '~/pages/Admin/components/DateRange/DateRange';
import Input from '~/pages/Admin/components/FormFieldInput/FormFieldInput';
import MultiSelect from '~/pages/Admin/components/FormMultiSelect/FormMultiSelect';
import Select from '~/pages/Admin/components/FormSelect/FormSelect';

const Form = () => {};

Form.BaseWarning = BaseWarning;
Form.BaseWrapper = BaseWrapper;
Form.Clay = ClayForm;
Form.Checkbox = Checkbox;
Form.DateRange = DateRange;
Form.Divider = (props: React.HTMLAttributes<HTMLHRElement>) => (
	<hr {...props} />
);
Form.Input = Input;
Form.MultiSelect = MultiSelect;
Form.Select = Select;
Form.Renderer = Renderer;

export default Form;
